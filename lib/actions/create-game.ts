"use server";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { verifyUser } from "../authentication";
import db from "../db";
import { answersTable, gamesTable } from "../db/schema";
import { whopSdk } from "../whop-sdk";
import { sendUpdate } from "./load-game";

export async function createGame(formData: FormData) {
	const experienceId = assertString(formData.get("experienceId"));
	const question = assertString(formData.get("question"));
	const answerCost = assertString(formData.get("answer-cost"));
	const answers = getAnswers(formData);

	const { userId } = await verifyUser(experienceId, "admin");

	const game = await db.query.gamesTable.findFirst({
		where: and(
			eq(gamesTable.experienceId, experienceId),
			isNull(gamesTable.completedAt),
		),
	});

	if (game) {
		throw new Error("A running game is already in progress");
	}

	const newGame = await db.transaction(async (tx) => {
		const [game] = await tx
			.insert(gamesTable)
			.values({
				experienceId,
				question,
				answerCost: Number.parseInt(answerCost),

				createdByUserId: userId,
			})
			.returning();

		await tx.insert(answersTable).values(
			answers.map((answer) => ({
				gameId: game.id,
				answer,
			})),
		);

		return game;
	});

	await sendUpdate(newGame.id);

	await whopSdk.notifications.sendPushNotification({
		title: "New 'Call it' game started",
		content: question,
		experienceId: newGame.experienceId,
		isMention: true,
		senderUserId: userId,
	});

	redirect(`/experiences/${experienceId}`);
}

function getAnswers(formData: FormData) {
	let index = 0;
	const answers: string[] = [];
	while (index < 20) {
		const answer = formData.get(`answer-option-${index}`);
		if (!answer || typeof answer !== "string") {
			break;
		}
		answers.push(answer);
		index++;
	}
	if (answers.length < 2) {
		throw new Error("You must provide at least 2 answer options");
	}
	return answers;
}

function assertString(value: unknown): string {
	if (!value) {
		throw new Error("Value is required");
	}
	if (typeof value !== "string") {
		throw new Error("Value is not a string");
	}
	return value;
}
