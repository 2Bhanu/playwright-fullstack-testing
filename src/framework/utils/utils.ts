export class utils {

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