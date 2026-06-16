import { z } from "zod";

import { deepMerge } from "./deepMerge";
import { DeepPartial } from "./types";




export function createData<
    TSchema extends z.ZodTypeAny,
    TTemplates extends Record<
        string,
        DeepPartial<z.infer<TSchema>>
    >
>(
    schema: TSchema,
    templates: TTemplates
) {

    return {

        schema,

        templates,

        generate(
            template: keyof TTemplates,
            overrides?: DeepPartial<
                z.infer<TSchema>
            >
        ): z.infer<TSchema> {

            const merged =
                deepMerge(
                    templates[template] as z.infer<TSchema>,
                    overrides
                );

            return schema.parse(merged);
        }
    };
}