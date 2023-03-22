// typescript ontology for voca, used around the project

export type Thing = {}
    export type Action = Thing & {}
        export type UserRegistrationAction = Action & {
            email: string;
            password: string;
            passwordConfirmation: string;
        }

        export type UserLoginAction = Action & {
            email: string;
            password: string;
        }

        export type UserResetPasswordAction = Action & {
            resetPasswordToken: string;
        }
    

    export type Credential = {
        jwt: string;
    }

    export type ParsedJWT = {
        sub: string;
        scope: string[]
        data:  Record<string, unknown> & {
            email: string;
        }
    }

    export type VocaError = {
        code: number,
        message: string
    }

    