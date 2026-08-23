/*
 * EndpointMap
 * ==========
 *
 * Single source of truth for logical endpoint names → path templates.
 * Clients reference paths via the logical name, never the literal
 * string, so renames and cross-environment swaps stay in one place.
 *
 * Path templating uses `:param` segments; resolve with `EndpointMap
 * .resolve(name, params)` before binding a `SimplifiedRequest`.
 *
 *     EndpointMap.resolve('reqres.singleUser', { id: '2' })
 *     // -> '/api/users/2'
 */

export interface EndpointRegistry {

    readonly reqres: {
        readonly listUsers: string;
        readonly singleUser: string;
        readonly createUser: string;
    };

    resolve(
        dottedName: string,
        params?: Record<string, string>
    ): string;
}


export const EndpointMap: EndpointRegistry = {

    /*
     * reqres.in
     * --------
     * Public demo API used for end-to-end smoke tests. Each entry is
     * the path segment appended to the client's `forURL` base.
     */
    reqres: {
        listUsers: '/api/users',
        singleUser: '/api/users/:id',
        createUser: '/api/users',
    },

    /*
     * Resolve a templated path against the EndpointMap.
     *
     *     EndpointMap.resolve('reqres.singleUser', { id: '2' })
     *     // -> '/api/users/2'
     *
     * Static paths (no `:param`) ignore the params argument.
     */
    resolve(
        dottedName: string,
        params: Record<string, string> = {}
    ): string {

        const segments = dottedName.split('.');

        // Walk into nested groups only — top-level keys other than
        // a group name (e.g. `resolve` itself) are not paths.
        let cursor: unknown = this;

        for (const segment of segments) {

            if (segment === 'resolve') {
                throw new Error(
                    `EndpointMap: '${dottedName}' is not a path template`
                );
            }

            if (
                cursor
                && typeof cursor === 'object'
                && segment in (cursor as Record<string, unknown>)
            ) {
                cursor = (cursor as Record<string, unknown>)[segment];
            } else {
                throw new Error(
                    `EndpointMap: unknown endpoint '${dottedName}'`
                );
            }
        }

        if (typeof cursor !== 'string') {
            throw new Error(
                `EndpointMap: '${dottedName}' is not a path template`
            );
        }

        return cursor.replace(
            /:([A-Za-z_][A-Za-z0-9_]*)/g,
            (_, key: string) => {
                const value = params[key];

                if (value === undefined) {
                    throw new Error(
                        `EndpointMap: '${dottedName}' missing param '${key}'`
                    );
                }

                return encodeURIComponent(value);
            }
        );
    },
};
