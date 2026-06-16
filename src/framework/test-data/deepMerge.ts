export function deepMerge<T>(
    target: T,
    source?: Partial<T>
): T {

    if (!source) {
        return structuredClone(target);
    }

    const result = structuredClone(target);

    for (const key of Object.keys(source)) {

        const k = key as keyof T;

        const sourceValue = source[k];
        const targetValue = result[k];

        if (
            sourceValue &&
            typeof sourceValue === "object" &&
            !Array.isArray(sourceValue)
        ) {

            result[k] = deepMerge(
                targetValue,
                sourceValue as any
            );

        } else {

            result[k] = sourceValue as any;
        }
    }

    return result;
}