export interface ApiRequest<
    TPayload,
    TQuery = never,
    TPathParams = never,
    THeaders = never
> {

    payload: TPayload;

    query?: TQuery;

    pathParams?: TPathParams;

    headers?: THeaders;
}