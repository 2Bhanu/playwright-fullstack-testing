import { z } from "zod";

import { createData } from "../createData";


export const UserData = createData(

    z.object({

        name: z.string(),

        email: z.string().email(),

        role: z.enum([
            "USER",
            "ADMIN"
        ]),

        active: z.boolean()

    }),

    {

        activeUser: {

            name: "John Doe",

            email: "john@test.com",

            role: "USER",

            active: true
        },

        adminUser: {

            name: "Admin User",

            email: "admin@test.com",

            role: "ADMIN",

            active: true
        },

        inactiveUser: {

            name: "Inactive User",

            email: "inactive@test.com",

            role: "USER",

            active: false
        }
    }
);

export type User =
    z.infer<
        typeof UserData.schema
    >;