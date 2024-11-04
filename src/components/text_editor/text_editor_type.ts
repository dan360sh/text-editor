export interface ContentBlocks {
    heading: string | null,
    bullets: string[]
}

export interface TextStructure {
    title: string | null,
    content_blocks: ContentBlocks[]
}