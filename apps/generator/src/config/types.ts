/**
 * PosterConfig — field names must match contracts/poster-config.schema.json
 * and the Python PosterConfig Pydantic model.
 */
export interface Config {
  theme: string;
  count: number;
  style: string;
  colors: string;
  composition: string;
  subjects: string[];
  widthInches: number;
  heightInches: number;
  dpi: number;
  /** Original NLP / creative brief used when building the final model prompt. */
  creativeBrief?: string;
}

export type PosterConfig = Config;
