'use strict';

const db = require('../../database');
const batch = require('../../batch');
const posts = require('../../posts');

module.exports = {
	name: 'Add target uid to flag objects',
	timestamp: Date.UTC(2020, 7, 22),
	method: async function () {
		const { progress } = this;

		await batch.processSortedSet('flags:datetime', async (flagIds) => {
			progress.incr(flagIds.length);
			const flagData = await db.getObjects(flagIds.map(id => `flag:${id}`));
			for (const flagObj of flagData) {
				/* eslint-disable no-await-in-loop */
				if (flagObj) { // if flagObj is not NULL. Possibly can refactor
					const { targetId } = flagObj;
					if (targetId) { // if targetId is not NULL. Pretty sure I can refactor with a simple &&
						if (flagObj.type === 'post') {
							const targetUid = await posts.getPostField(targetId, 'uid');
							if (targetUid) { // if targetUid is not NULL
								await db.setObjectField(`flag:${flagObj.flagId}`, 'targetUid', targetUid);
							}
						} else if (flagObj.type === 'user') {
							await db.setObjectField(`flag:${flagObj.flagId}`, 'targetUid', targetId);
						}
					}
				}
			}
		}, {
			progress: progress,
			batch: 500,
		});
	},
};
