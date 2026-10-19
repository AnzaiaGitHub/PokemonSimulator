export interface NamedApiResource {
  readonly name: string;
  readonly url: string;
}

export interface ApiResourceList {
  readonly count: number;
  readonly next: string | null;
  readonly previous: string | null;
  readonly results: readonly NamedApiResource[];
}
