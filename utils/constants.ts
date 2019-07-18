/*
 * Constants for KM (tags, langs, types, etc.).
 */

/** Regexps for validation. */
export const uuidRegexp = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
export const mediaFileRegexp = '^.+\\.(avi|mkv|mp4|webm|mov|wmv|mpg|ogg|m4a|mp3)$';
export const imageFileRegexp = '^.+\\.(jpg|jpeg|png|gif)$';
export const subFileRegexp = '^.+\\.ass$';
export const md5Regexp = '[0-9a-f]{32}';
export const imageFileTypes = ['jpg', 'jpeg', 'png', 'gif'];
export const bools = [true, false, 'true', 'false', undefined];

export function getTagTypeName(type: number): string {
	return Object.keys(tagTypes).find(t => tagTypes[t] === type);
}

export const tagTypes = Object.freeze({
	singers: 2,
	songtypes: 3,
	creators: 4,
	langs: 5,
	authors: 6,
	misc: 7,
	songwriters: 8,
	groups: 9,
	families: 10,
	origins: 11,
	genres: 12,
	platforms: 13
});

export const langsUUIDs = {
	"abk": "c4613311-af65-4e1f-b5f4-81551b406f54",
	"aar": "b7dbae87-783e-485c-aa14-c1111877169d",
	"afr": "ce958078-673b-4828-ab68-82fad6e32304",
	"aka": "29bce008-693a-423d-a949-047b25ccb3ca",
	"alb": "68565f99-d736-4197-87f3-15dba24b462d",
	"amh": "f88e6a28-55f5-452b-9a5c-cebead78c629",
	"ara": "95930d74-0d30-40ec-9695-2efd968fd002",
	"arg": "754f198e-9a84-4de8-bba5-069e066e2f6a",
	"arm": "951c4030-2365-449b-b033-bf7f5a4be66e",
	"asm": "d851a592-31de-4067-b664-1fbfdc40b6f5",
	"ava": "279333c1-c790-4bba-bfda-6624912aaadf",
	"ave": "0c5a983a-aaa7-43c9-97ec-398e61d6b33c",
	"aym": "6ee25e1f-1f79-486a-9873-a59d8b4dc181",
	"aze": "25ec5228-e14e-424b-b698-04068ea6ea07",
	"bam": "58f575fe-6b6e-448d-a032-e19c46b2fe2f",
	"bak": "43026873-35ba-46e4-8207-2f6524fba132",
	"baq": "88834cc9-9ac5-457a-9744-a794e9a3f869",
	"bel": "65ca37e2-44a6-46ba-a1ab-8beacc92818c",
	"ben": "37dfe992-a00b-43db-ae06-d8d55644e5bf",
	"bih": "49129e0b-e7d6-4365-91b3-62f580f43efb",
	"bis": "f926b1ea-83a5-47ac-8c81-acfeaa04011e",
	"bos": "da6a4c00-9f89-44d4-bee5-c6825c1421dd",
	"bre": "51e33538-1db0-4373-949a-e29b8cb8c8aa",
	"bul": "ff1e9a99-9812-4af3-9513-a0e6c5dc640d",
	"bur": "340d4600-90dd-4068-b093-5ee5f61440af",
	"cat": "a516e4ef-6203-4158-9ab8-2b3f6bbd4c6a",
	"cha": "922b14c4-5f0f-4cd0-b65e-4c0b7eed87ed",
	"che": "d361546b-8f2f-46fa-95ec-541e3ccfcfc7",
	"nya": "b96999e4-42a6-4b9d-920b-bcf4eb918400",
	"chi": "0666dafc-1d56-461c-ae40-5151bf8f0591",
	"chv": "a6742dc1-fc50-4b18-beb7-7eaa7d1b4ad4",
	"cor": "8cd1dd83-4845-4cc7-9155-5aada0be838a",
	"cos": "b2eda8a7-d458-4076-8ad0-efc727e8c352",
	"cre": "cbfd5e38-b87b-48e7-aebb-98638b86ca3a",
	"hrv": "68d32ff9-9d8d-4044-90d7-8eed85b4af5a",
	"cze": "d6dbe857-3229-44f9-8d13-aecb99ab5fcc",
	"dan": "a18ac03b-4fd8-4608-81a3-c14e58e69816",
	"div": "2d64de3b-8b0a-4a59-a57f-ce720759c927",
	"dut": "d5218c94-970b-44b2-923a-56ad18293dd6",
	"dzo": "2265418d-d54a-4709-9004-1186d315be05",
	"eng": "77d8aa4b-dcb7-4200-a9b8-a1a671cb224e",
	"epo": "da229f71-ac1c-4a62-a770-a62542f87e90",
	"est": "ee96954b-bb8f-4ca9-a648-1923c0a942ed",
	"ewe": "31a4dbfe-a3c2-48fd-af1b-d8b98429465e",
	"fao": "0120274b-dad9-472e-b9a3-0dacc1dd0a3c",
	"fij": "86288046-8e10-4462-a570-12e5ab82d547",
	"fin": "5bf9fc1d-a92e-462f-94b3-bdea4f58c137",
	"fre": "78a71fad-7039-41a8-a867-86039920bd17",
	"ful": "217c02fa-ea47-44ef-b000-e21c39098466",
	"glg": "6072afff-43f2-4d15-83a7-2a314511e494",
	"geo": "6ab99399-3864-472a-ac69-d9e48856d406",
	"ger": "174fb04f-b48a-4f75-952f-5824d881377e",
	"gre": "9e29e7a5-7625-46d2-9592-b0008672b4ee",
	"grn": "f2fd0793-96ac-4b68-982b-b0a6e5fb18ed",
	"guj": "0a9d97e1-255c-4d63-ab03-91005b1dbbea",
	"hat": "877ad7c6-6a78-4464-8c4e-97d5a55d4d9d",
	"hau": "7ca6fc9a-b06e-4a43-afb4-fb3fb39418c8",
	"heb": "81fbf402-6971-430e-9b2a-234b132b5986",
	"her": "6086b827-02f4-47de-8a27-523bf31535b5",
	"hin": "4323a317-96a2-40d4-ac30-a9d3c9ffdcf9",
	"hmo": "53db3f7e-403a-4a53-8685-ef00da7afbac",
	"hun": "23f1f8d3-6895-40a0-97fa-1ba4fa1989e1",
	"ina": "d553a09c-abac-4fef-aafb-f3a25c5e182a",
	"ind": "b6dd72a3-4f06-4a38-8c23-f16cd17c27ef",
	"ile": "37e0d717-6acf-4e73-be98-72f1638b5b4a",
	"gle": "c621767b-7bfd-451e-9355-57f5fc573017",
	"ibo": "9318e922-21a9-4f75-a533-825f35bf0fda",
	"ipk": "0b9a4256-6103-4b61-8978-26c99f740e3a",
	"ido": "6123b7a1-7bbb-499d-8b92-61069541e84f",
	"ice": "c1b817a3-0c53-4c5e-95b6-55ec13dff555",
	"ita": "4114f10c-460e-47a2-baa4-608edbfe9310",
	"iku": "7f5c999f-bbc7-486f-83d5-555c73e8b7dc",
	"jpn": "52ca1402-a9a1-4507-8272-1ff7cd94ee67",
	"jav": "373a642c-88ca-4837-b3c2-ac765577569c",
	"kal": "93f0ea0f-e348-4a44-b4ee-faf4c76bd29c",
	"kan": "9cf709be-2370-48a2-9fd3-0cb79c65113f",
	"kau": "0b6ff38a-bb81-480b-a656-0b3d263347ff",
	"kas": "5ebbaa27-a4db-4d54-b514-a30d5c59329c",
	"kaz": "e002aba6-df24-4b42-a6ba-b588686dabfa",
	"khm": "95f94ead-0335-442e-b399-9d4adbc21cba",
	"kik": "4a528eae-e15a-436e-808f-a828df188045",
	"kin": "5b5ce09d-fe7c-44e1-8562-d4b36ec59c73",
	"kir": "73847613-a6f4-47d3-b322-2a89a9a8a8da",
	"kom": "5edad637-93da-41f5-9996-a47b3edb7a6f",
	"kon": "eddfb028-9cb4-4f52-a773-f66dfe55517e",
	"kor": "b9f5a7a7-020e-45ca-ba11-b1d4abf35265",
	"kur": "3a8689c0-a88b-4ccf-8784-98d50d172047",
	"kua": "026339c7-8d69-4177-a75d-0d7d45c4f4f5",
	"lat": "893bc8c2-d146-42c7-add0-e8846d0d4571",
	"ltz": "76fc4ac1-60f4-40ae-b13b-e376e7e7b105",
	"lug": "fbf0d1de-27f1-4c94-97ff-58e2cab2acce",
	"lim": "6427989f-4c3f-4540-bab3-97a58645a6f2",
	"lin": "046c0ba8-a7c7-4e86-bcb2-4adf6724d26a",
	"lao": "e6a23a26-fd82-40fe-b3a9-c77c8564bdd6",
	"lit": "53b862ab-62d5-4082-92f4-db07e5b6c35d",
	"lub": "048c7e62-8e25-478f-8e3e-faf6cde8709d",
	"lav": "ca16c92d-8c43-46a0-94be-d69b123b15db",
	"glv": "edea8770-4be2-418f-9874-14de732b9f79",
	"mac": "0c3eaf12-b82e-43f9-b5b2-789acf87f595",
	"mlg": "8df3c24d-3f6a-4a48-956e-c6fc9657c010",
	"may": "91161c9d-72e1-477c-81f7-8c49fa455016",
	"mal": "25ae25ab-3509-4c6e-acea-8b616cd11887",
	"mlt": "82904c49-35b9-429b-af28-549d8f0c9fab",
	"mao": "137ce44a-3230-4a76-a941-804338424fc0",
	"mar": "6ca2bd63-4235-4df2-a4e7-23b5285ae2c5",
	"mah": "2f52d300-8244-4651-a9ec-054199e8dcf6",
	"mon": "dcf990ce-437a-40b2-99de-16f7db9d7eb4",
	"nau": "1f654dda-866c-49d1-be8f-25cf566f3bc0",
	"nav": "678a5cb3-fa91-4b32-9d49-663d9cede5b5",
	"nde": "54eb343a-cae4-43fe-a7cd-5dee84dabaf5",
	"nep": "fe86a996-f69f-496c-b6d7-66561460bbb7",
	"ndo": "76d46323-398e-416b-b1e9-5f6f799551d4",
	"nob": "2e08301b-d8e1-47bb-add4-9de90072c020",
	"nno": "b2173023-dc97-4427-8caf-1bdaa89844ea",
	"nor": "dbf078f2-2db9-44fb-ac04-b5158427911d",
	"iii": "34ee53df-c96d-49ac-bb99-cfd5bbad4f66",
	"nbl": "f9fa2544-8911-482a-b26d-78b7dd7628ea",
	"oci": "d18bb701-e6d6-4423-8d07-f04c92498f1c",
	"oji": "e6e93bb3-0928-403e-8bc7-de2bf2f22bae",
	"chu": "7ee0e0bf-8e02-4edf-a8e1-d94420f9ad03",
	"orm": "3aee5544-d438-41b6-a879-a942e8601ebe",
	"ori": "68b6deb2-3f70-4271-8955-c9618bf3a832",
	"oss": "2443ac11-8c8e-49ae-a295-e02f9ddc22ea",
	"pan": "62d3c925-965d-47b7-b528-11108dfec1e3",
	"pli": "43da8463-dad9-4cd9-8fd0-aa9ad7719eef",
	"per": "62b7db0e-d0a2-491d-91eb-146eeb2c0f8d",
	"pol": "6ca8599c-4964-42f1-840e-6973a6951eb6",
	"pus": "0502e669-273e-443b-aa38-f25f74bb6de7",
	"por": "ac3aa382-5afe-458d-90ac-94fb284f21fa",
	"que": "267c8064-f6ee-4b15-bcfc-9e40079a58ff",
	"roh": "a92be6f9-ac65-4d23-bf0a-f318c18f3a9d",
	"run": "6e117bbb-4161-4a6b-9f41-dc9a7871e274",
	"rum": "33b81b38-4895-436b-9ddb-85219dd6762b",
	"rus": "551bdf10-1fd7-4e37-8d09-5eda4066cdc0",
	"san": "27b1e364-4d4f-4a94-91b8-900c35308001",
	"srd": "7ed4208f-760c-44fb-8e92-420746e6d385",
	"snd": "a7f07e41-e3c1-4225-a88d-47ec5403dcd8",
	"sme": "9e9066db-066f-4b5d-a1bf-56ae814db24b",
	"smo": "51e765c2-e254-4fc5-b304-ed9ff0a5d072",
	"sag": "2d6aacc0-021b-4291-8a33-415efd625225",
	"srp": "b8bc40f9-51d3-46a3-8013-98d72cc9716a",
	"gla": "5b761c9c-8d0b-4554-bd26-9a451848a6af",
	"sna": "b8093602-e97b-4a94-b558-8255bbaefa94",
	"sin": "ae1c9512-ddb8-410d-918b-d5e40878e3e3",
	"slo": "a626c5eb-0075-4c1f-9473-64a9ca048d88",
	"slv": "d868fd92-1765-4c2e-9e44-e5e0c4634950",
	"som": "2fcb5404-9b28-4685-b5ab-3a2c7a2021a8",
	"sot": "d3ce2380-d6f1-4793-8945-fa56e64b7a1e",
	"spa": "aeed2efe-b00b-4351-9dd8-46dbbdd76bd4",
	"sun": "cb205ada-f960-4de2-94a9-73f8ee6b83ee",
	"swa": "b0984716-0609-4dae-b376-3be177ed9b87",
	"ssw": "85c7427a-4879-4c54-b8ac-887810e2672b",
	"swe": "eb2453cb-a3d0-4d10-a444-f61ac6ba807f",
	"tam": "9234fcee-67ff-442a-92c4-7e3d0b5db76b",
	"tel": "af422689-69f9-47f3-9e8a-98e770fc507a",
	"tgk": "0dbe9b9d-f137-48b6-b193-503f6cd66b33",
	"tha": "552eafc3-084a-47cc-a246-cbea9902aa72",
	"tir": "eee9df89-510d-4274-89f7-97e5adfed243",
	"tib": "9b0fee08-d035-462c-86ed-1c63fe81189f",
	"tuk": "3fc3c5ef-2a99-48e6-a6d7-327b226179f6",
	"tgl": "490034e8-4c61-4cce-b5c9-0044853922f0",
	"tsn": "25416643-8c7d-4c6e-bc2c-4cdea9afd20a",
	"ton": "06188123-92f0-47bf-adc7-68eaca756823",
	"tur": "6de08091-fce0-40bf-a9fb-e6ad33133b42",
	"tso": "55d237ca-6371-4525-9b20-a1a7ca5b68c4",
	"tat": "0c0fd600-0def-4d30-a963-12648a4a2fc7",
	"twi": "d1a8e6fe-91f1-424c-ab04-cd87cb3ff189",
	"tah": "10483c48-8242-40fe-8c38-87843fb6ba64",
	"uig": "0fe0db35-a927-4069-91f9-d880da827b3b",
	"ukr": "2bf9350b-0c80-4440-88e0-fa20871e1101",
	"urd": "ac5fa7ef-72d5-4479-8067-a68c78245322",
	"uzb": "22620902-99d5-4f2a-ad48-e7a24a1fc18f",
	"ven": "c3a6fa7e-db6e-4f78-9d79-485b0003d62e",
	"vie": "5654bd39-d678-4d5f-8546-5b1cae78f7c5",
	"vol": "8bd5efc9-f94e-4249-856f-c4500c8f1842",
	"wln": "b7973198-e020-4064-84fa-e4d5fbbe43fd",
	"wel": "e6109758-14b2-4019-85f3-92160460dbb9",
	"wol": "3ead0f0c-94ac-4a6e-b7ce-f04b5964f495",
	"fry": "bc907a5d-8383-4f53-9475-5c61619674f4",
	"xho": "a8235909-c464-4795-a9db-24391c27d2ef",
	"yid": "e716df49-9f68-446d-98c2-975d4e243835",
	"yor": "88e152b1-8871-49b7-8571-e41a140e6d91",
	"zha": "527ab677-5321-445a-a795-e6bddad628a4",
	"zul": "d0a98c2b-42bd-4c8f-bb45-5350112801d0",
	"mul": "17475c03-90d9-4681-9d58-37bedb82765c",
	"und": "b98d56bc-89f3-427a-a761-4b3a81868e93",
	"zxx": "31ba35d7-3862-4934-bce2-f49cace4e438"
}
