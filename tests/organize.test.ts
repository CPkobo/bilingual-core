import { CatovisOrganizer } from "../src/office-funcs/organizer"

describe("Organizerの動作チェック", () => {
	test("new", () => {
		const org = new CatovisOrganizer()
		const opt = org.dumpOption()
		expect(opt.common.name).toBe("Result")
	})
})