// Option
declare interface CommonOption {
    name?: string;
    segmentation?: boolean;
    delimiters?: string;
    excluding?: boolean;
    excludePattern?: string;
    withSeparator?: boolean;
}

declare interface WordOption {
    afterRev?: boolean;
    afterRev2?: boolean;
}

declare interface ExcelOption {
    readHiddenSheet?: boolean;
    readFilledCell?: boolean;
}

declare interface PptOption {
    readSlide?: boolean;
    readNote?: boolean;
}

declare interface CatOption {
    locales: string[] | 'all';
    fullset: boolean;
    overWrite: boolean;
}

declare interface OptionQue {
    common?: CommonOption;
    office?: OfficeOption
    cat?: CatOption
}

declare interface WWCRate {
    dupli: number;
    over95: number;
    over85: number;
    over75: number;
    over50: number;
    under49: number;
}

declare interface OfficeOption {
    word?: WordOption
    excel?: ExcelOption
    ppt?: PptOption
}

declare interface MyOption {
    common: Required<CommonOption>
    office: Required<OfficeOption>
    cat: Required<CatOption>
}