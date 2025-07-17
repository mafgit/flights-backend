export interface IAirline {
    id: number;
    name: string;
    code: string;
    country: string;
    logo_url: string;
}

export type IAddAirline = Pick<IAirline, "name" | "code" | "country" | "logo_url">