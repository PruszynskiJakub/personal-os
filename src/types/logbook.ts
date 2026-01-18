export interface DiveLogbookRecord {
    uuid: string | undefined
    spot: string, //required
    max_depth: number, //required
    duration: number, //required
    salty: boolean, //optional
    weights: number | null, //optional
    tank: number | null, //optional
    tank_type: "aluminium" | "steel" | null, //optional
    start_air: number | null,
    end_air: number | null,
    dive_school: string | null,
    score: number | null // optional
    date: string, //required,
}