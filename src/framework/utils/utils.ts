export class utils {

    /*
    The base URL is normalized to a full URL with scheme and host.
     * If the base URL is already a full URL, it is used as-is. If it
     * is a relative path, it is resolved against the default base URL.
     * */
    static buildUrl(
        endpoint: string,
        baseURL: string 
    ): string {
        if (!/^https?:\/\//i.test(baseURL)) {
        baseURL = `https://${baseURL}`;
    }
        return new URL(endpoint, baseURL).toString();
    }

}