import { Authenticator } from "./authenticator.js";

export class Section {
	constructor(content, requireAuth=false) {
		this.content = content;
		this.requiresAuth = requireAuth;
	}

	loadSection() {
		console.warn('Section: loadSection not implemented!');
	}

	exitSection() {
		console.warn('Section: exitSection not implemented!');
	}
}

export class SectionManager {
	static #currentSection = undefined;
	static #app = document.querySelector('#app');

	static showSection(sectionName) {
		const section = `./${sectionName}.js`;
		import(section)
		.then(async (module) => {
			if (!module?.SECTION) {
				throw Error("Invalid Section Module");
			}
			if (module.SECTION.requiresAuth && !await Authenticator.isAuth()) {
				SectionManager.showSection('login');
				return;
			}

			// const currentState = history.state
			// if (section != 'waiting' && (!currentState || currentState.section != section))
			// 	history.pushState({ section, lobbyId }, '', `/${section}${lobbyId ? `?lobbyId=${lobbyId}` : ''}`);

			this.#currentSection?.exitSection();
			this.#app.innerHTML = module.SECTION.content;
			module.SECTION.loadSection();
			this.#currentSection = module.SECTION;
		})
		.catch(reason => console.error("SectionManager:", reason));
	}
}
