import { safeJson } from "./api-utils";

export interface PineDramaEpisode {
  has_purchased: boolean;
  is_intro: boolean;
  is_limited_free: boolean;
  is_paid: boolean;
  num: number;
  seq_id: number;
  video_id: string;
}

export interface PineDramaCollection {
  collection_id: string;
  title: string;
  cover: {
    url_list: string[];
    uri: string;
  };
  num_videos: number;
  num_watched: number;
  categories: string;
  is_limited_free: boolean;
  label_hot: boolean;
}

export interface PineDramaHomeResponse {
  collections: PineDramaCollection[];
  banner_config?: {
    image_url: string;
    title: string;
    sub_title: string;
  };
}

export interface PineDramaDetailResponse {
  creator_uid: string;
  episode_list: PineDramaEpisode[];
}

export interface PineDramaStreamResponse {
  // TikTok's protobuf-to-JSON structure for video streams
  // Simplifying based on user's sample
  [key: string]: any;
}

export class PineDramaScraper {
  private apiBase = "https://api16-normal-c-alisg.tiktokv.com";

  // Use user-provided cookies for authentication (Akun Tumbal)
  private defaultCookies = "store-idc=alisg; store-country-code=id; install_id=7622296125655074561; ttreq=1$d454f0b5d63b0e5a19262643ed24a7e0e069aec9; sid_guard=07cb173839f7d055d9ecf79d1b74e645%7C1774704225%7C5184000%7CWed%2C+27-May-2026+13%3A34%3A23+GMT; uid_tt=c4e3ece731b7171bb816186fb3d08f07533db29034e78010c1b1199160994104; uid_tt_ss=c4e3ece731b7171bb816186fb3d08f07533db29034e78010c1b1199160994104; sid_tt=07cb173839f7d055d9ecf79d1b74e645; sessionid=07cb173839f7d055d9ecf79d1b74e645; sessionid_ss=07cb173839f7d055d9ec";

  private defaultParams: any = {
    device_platform: "android",
    os: "android",
    ssmix: "a",
    channel: "googleplay",
    aid: "845221",
    app_name: "tiktok_drama",
    version_code: "430901",
    version_name: "43.9.1",
    manifest_version_code: "2024309010",
    update_version_code: "2024309010",
    ab_version: "43.9.1",
    resolution: "540*960",
    dpi: "160",
    device_type: "PGT-AN10",
    device_brand: "Honor",
    language: "id",
    os_api: "28",
    os_version: "9",
    ac: "wifi",
    is_pad: "0",
    current_region: "ID",
    app_type: "normal",
    sys_region: "ID",
    mcc_mnc: "51000",
    timezone_name: "Asia/Bangkok",
    carrier_region_v2: "510",
    residence: "ID",
    app_language: "id",
    carrier_region: "ID",
    app_package: "com.ss.android.ugc.tiktok.lite",
    timezone_offset: "25200",
    host_abi: "arm64-v8a",
    locale: "id-ID",
    ac2: "wifi",
    uoo: "0",
    op_region: "ID",
    build_number: "43.9.1",
    app_package_type: "pro",
    region: "ID",
    iid: "7622296125655074561",
    device_id: "7621195145840887312"
  };

  public getRequestHeaders() {
    return {
      "Cookie": this.defaultCookies,
      "User-Agent": "com.ss.android.ugc.tiktok.lite/2024309010 (Linux; U; Android 9; id_ID; PGT-AN10; Build/PQ3A.190801.002; Cronet/TTNetVersion:1774704775)",
      "Accept": "application/json",
      "Host": "api16-normal-c-alisg.tiktokv.com",
      "Connection": "Keep-Alive"
    };
  }

  public buildUrl(path: string, params: Record<string, any> = {}) {
    const url = new URL(`${this.apiBase}${path}`);
    const allParams = { ...this.defaultParams, ...params };

    Object.entries(allParams).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    url.searchParams.append("ts", Math.floor(Date.now() / 1000).toString());
    url.searchParams.append("_rticket", Date.now().toString());

    return url.toString();
  }

  async getHome(cursor: string = "", count: number = 15): Promise<PineDramaHomeResponse> {
    const url = this.buildUrl("/tiktok/md/mini_drama_center/v1/", {
      cursor,
      count,
      scene: "1",
      is_validate: "0",
      is_preload: "0",
      is_mixed_column_page: "false"
    });

    const response = await fetch(url, { headers: this.getRequestHeaders() });
    if (!response.ok) throw new Error(`PineDrama Home Error: ${response.statusText}`);
    return await safeJson<PineDramaHomeResponse>(response);
  }

  async getEpisodes(collectionId: string, cursor: string = "0"): Promise<any> {
    const url = this.buildUrl("/tiktok/md/collection/episode_panel/v1/", {
      collection_id: collectionId,
      cursor: cursor,
      count: "50" // Increase count to reduce requests
    });

    const response = await fetch(url, { headers: this.getRequestHeaders() });
    if (!response.ok) throw new Error(`PineDrama Detail Error: ${response.statusText}`);
    return await safeJson<any>(response);
  }

  async getStream(collectionId: string, videoId: string = "0", currentSeqId: number = 0): Promise<any> {
    const url = this.buildUrl("/tiktok/md/collection/video/v1/", {
      collection_id: collectionId,
      video_id: videoId,
      count: "1",
      current_seq_id: currentSeqId,
      direction: "1",
      enter_from: "paid_series_detail_page",
      request_source: "innerfeed",
      root_scene: "2",
      is_trailer_paginated: "false",
      need_collection_detail: "true",
      query_type: "last_watch",
      query_scene: "mini_drama_container"
    });

    const response = await fetch(url, { headers: this.getRequestHeaders() });
    if (!response.ok) throw new Error(`PineDrama Stream Error: ${response.statusText}`);
    return await safeJson<any>(response);
  }

  async getMultiAwemeDetail(videoId: string): Promise<Response> {
    const url = this.buildUrl("/aweme/v1/multi/aweme/detail/", {
      aweme_ids: `["${videoId}"]` // JSON array format for TikTok Lite
    });

    const response = await fetch(url, { headers: this.getRequestHeaders() });
    if (!response.ok) throw new Error(`PineDrama Multi Aweme Detail Error: ${response.statusText}`);
    return response;
  }
}
