import { Section, SectionManager } from "./section.js";

export const SECTION = new Section(`
	<span>Hello Test Section!</span>
`);

SECTION.loadSection = () => {
	console.log('INIT SECTION!');
};

SECTION.exitSection = () => {
	console.log('CLEAN SECTION!');
};
