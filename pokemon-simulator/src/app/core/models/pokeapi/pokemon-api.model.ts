import { ApiResourceList, NamedApiResource } from './named-api-resource.model';

export type PokemonListResponse = ApiResourceList;

export interface PokemonAbility {
  readonly ability: NamedApiResource;
  readonly is_hidden: boolean;
  readonly slot: number;
}

export interface PokemonTypeSlot {
  readonly slot: number;
  readonly type: NamedApiResource;
}

export interface PokemonStat {
  readonly base_stat: number;
  readonly effort: number;
  readonly stat: NamedApiResource;
}

export interface PokemonMoveVersionGroupDetail {
  readonly level_learned_at: number;
  readonly move_learn_method: NamedApiResource;
  readonly order: number | null;
  readonly version_group: NamedApiResource;
}

export interface PokemonMove {
  readonly move: NamedApiResource;
  readonly version_group_details: readonly PokemonMoveVersionGroupDetail[];
}

export interface PokemonGameIndex {
  readonly game_index: number;
  readonly version: NamedApiResource;
}

export interface PokemonHeldItemVersionDetail {
  readonly rarity: number;
  readonly version: NamedApiResource;
}

export interface PokemonHeldItem {
  readonly item: NamedApiResource;
  readonly version_details: readonly PokemonHeldItemVersionDetail[];
}

export interface PokemonCries {
  readonly latest: string;
  readonly legacy: string;
}

export interface DreamWorldSprites {
  readonly front_default: string | null;
  readonly front_female: string | null;
}

export interface HomeSprites {
  readonly front_default: string | null;
  readonly front_female: string | null;
  readonly front_shiny: string | null;
  readonly front_shiny_female: string | null;
}

export interface OfficialArtworkSprites {
  readonly front_default: string | null;
  readonly front_shiny: string | null;
}

export interface ShowdownSprites {
  readonly back_default: string | null;
  readonly back_female: string | null;
  readonly back_shiny: string | null;
  readonly back_shiny_female: string | null;
  readonly front_default: string | null;
  readonly front_female: string | null;
  readonly front_shiny: string | null;
  readonly front_shiny_female: string | null;
}

export interface PokemonSpriteOther {
  readonly dream_world: DreamWorldSprites;
  readonly home: HomeSprites;
  readonly 'official-artwork': OfficialArtworkSprites;
  readonly showdown: ShowdownSprites;
}

export interface PokemonSprites {
  readonly back_default: string | null;
  readonly back_female: string | null;
  readonly back_shiny: string | null;
  readonly back_shiny_female: string | null;
  readonly front_default: string | null;
  readonly front_female: string | null;
  readonly front_shiny: string | null;
  readonly front_shiny_female: string | null;
  readonly other: PokemonSpriteOther;
  readonly versions: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
}

export interface PokemonResponse {
  readonly id: number;
  readonly name: string;
  readonly base_experience: number | null;
  readonly height: number;
  readonly weight: number;
  readonly order: number;
  readonly is_default: boolean;
  readonly location_area_encounters: string;
  readonly abilities: readonly PokemonAbility[];
  readonly cries: PokemonCries;
  readonly forms: readonly NamedApiResource[];
  readonly game_indices: readonly PokemonGameIndex[];
  readonly held_items: readonly PokemonHeldItem[];
  readonly moves: readonly PokemonMove[];
  readonly species: NamedApiResource;
  readonly sprites: PokemonSprites;
  readonly stats: readonly PokemonStat[];
  readonly types: readonly PokemonTypeSlot[];
}
