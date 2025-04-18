'use server';

import { db } from "@/firebase/admin";
import { generateObject } from "ai";
import { feedbackSchema } from "@/constants";
import { google } from "@ai-sdk/google";

interface GetLatestInterviewsParams {
    userId?: string; // userId is now optional
    limit?: number;
    interviewId?: string; // Added interviewId as optional here as well, if needed
}

interface CreateFeedbackParams {
    interviewId: string;
    userId: string;
    transcript: { role: string; content: string }[];
    feedbackId?: string; // Assuming feedbackId might be optional
}

interface Interview {
    id: string;
    userId: string;
    createdAt: string;
    // ... other interview properties
}

interface Feedback {
    id: string;
    interviewId: string;
    userId: string;
    totalScore: number;
    categoryScores: any; // Define more specific type if possible
    strengths: string;
    areasForImprovement: string;
    finalAssessment: string;
    createdAt: string;
    // ... other feedback properties
}

export async function getInterviewByUserId(userId: string): Promise<Interview[] | null> {
    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    const interviews = await db
        .collection('interviews')
        .orderBy('createdAt', 'desc')
        .where('finalized', '==', true)
        .where('userId', '!=', userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getInterviewById(id: string): Promise<Interview | null> {
    const interviews = await db
        .collection('interviews')
        .doc(id)
        .get();

    return interviews.data() as Interview | null;
}

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript } = params;

    try {
        const formattedTranscript = transcript
            .map((sentence) => (`- ${sentence.role}: ${sentence.content}\n`))
            .join('');

        const { object: { totalScore, categoryScores, strengths, areasForImprovement, finalAssessment } } = await generateObject({
            model: google('gemini-2.0-flash-001', {
                structuredOutputs: false,
            }),
            schema: feedbackSchema,
            prompt: `You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
                Transcript:
                ${formattedTranscript}

                Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
                - **Communication Skills**: Clarity, articulation, structured responses.
                - **Technical Knowledge**: Understanding of key concepts for the role.
                - **Problem-Solving**: Ability to analyze problems and propose solutions.
                - **Cultural & Role Fit**: Alignment with company values and job role.
                - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
                `,
            system: "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
        });

        const feedback = await db.collection('feedback').add({
            interviewId,
            userId,
            totalScore,
            categoryScores,
            strengths,
            areasForImprovement,
            finalAssessment,
            createdAt: new Date().toISOString(),
        });

        return {
            success: true,
            feedbackId: feedback.id
        };
    } catch (e) {
        console.error('Error saving feedback', e);
        return { success: false };
    }
}

export async function getFeedbackByInterviewId(params: GetLatestInterviewsParams): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    if (!interviewId) {
        console.error("Error: interviewId is required to fetch feedback.");
        return null;
    }

    let feedbackQuery = db.collection('feedback').where('interviewId', '==', interviewId);

    if (userId) {
        feedbackQuery = feedbackQuery.where('userId', '==', userId);
    }

    feedbackQuery = feedbackQuery.limit(1);
    const feedbackSnapshot = await feedbackQuery.get();

    if (!feedbackSnapshot.empty) {
        const feedbackDoc = feedbackSnapshot.docs[0];
        return {
            id: feedbackDoc.id,
            ...feedbackDoc.data(),
        } as Feedback;
    }

    return null;
}