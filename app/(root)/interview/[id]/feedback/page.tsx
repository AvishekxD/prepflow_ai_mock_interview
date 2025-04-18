import React from 'react'
import {getCurrentUser} from "@/lib/actions/auth.action";
import {getFeedbackByInterviewId, getInterviewById} from "@/lib/actions/general.action";
import {redirect} from "next/navigation";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import dayjs from "dayjs";
import Image from "next/image";

interface RouteParams {
    params: {
        id: string;
    };
}

const Page = async ({ params }: RouteParams) => {
    const { id } = params; // Correctly extract 'id' from params
    const user = await getCurrentUser();

    const interview = await getInterviewById(id);
    if(!interview) redirect('/')

    const feedback = await getFeedbackByInterviewId({
        interviewId: id, // Corrected parameter name to 'interviewId'
        userId: user?.id!,
    });

    console.log("Feedback data:", feedback); // Keep this for debugging on the server

    return (
        <section className="section-feedback">
            <div className="flex flex-row justify-center">
                <h1 className="text-4xl font-semibold">
                    Feedback on the Interview -{" "}
                    <span className="capitalize">{interview.role}</span> Interview
                </h1>
            </div>

            <div className="flex flex-row justify-center ">
                <div className="flex flex-row gap-5">
                    {/* Overall Impression */}
                    <div className="flex flex-row gap-2 items-center">
                        <Image src="/star.svg" width={22} height={22} alt="star" />
                        <p>
                            Overall Impression:{" "}
                            <span className="text-primary-200 font-bold">
                                {feedback?.totalScore !== undefined ? feedback.totalScore : "N/A"}
                            </span>
                            /100
                        </p>
                    </div>

                    {/* Date */}
                    <div className="flex flex-row gap-2">
                        <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
                        <p>
                            {feedback?.createdAt
                                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A") // Corrected date formatting
                                : "N/A"}
                        </p>
                    </div>
                </div>
            </div>

            <hr />

            <p>{feedback?.finalAssessment || "No final assessment available."}</p>

            {/* Interview Breakdown */}
            <div className="flex flex-col gap-4">
                <h2>Breakdown of the Interview:</h2>
                {feedback?.categoryScores && feedback.categoryScores.length > 0 ? (
                    feedback.categoryScores.map((category: { name: string; score: number; comment: string }, index: number) => (
                        <div key={index}>
                            <p className="font-bold">
                                {index + 1}. {category.name} ({category.score}/100)
                            </p>
                            <p>{category.comment || "No comment provided for this category."}</p>
                        </div>
                    ))
                ) : (
                    <p>No breakdown of categories available.</p>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <h3>Strengths</h3>
                {feedback?.strengths && feedback.strengths.length > 0 ? (
                    <ul>
                        {feedback.strengths.map((strength: string, index: number) => (
                            <li key={index}>{strength}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No strengths identified.</p>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <h3>Areas for Improvement</h3>
                {feedback?.areasForImprovement && feedback.areasForImprovement.length > 0 ? (
                    <ul>
                        {feedback.areasForImprovement.map((area: string, index: number) => (
                            <li key={index}>{area}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No areas for improvement identified.</p>
                )}
            </div>

            <div className="buttons">
                <Button className="btn-secondary flex-1">
                    <Link href="/" className="flex w-full justify-center">
                        <p className="text-sm font-semibold text-primary-200 text-center">
                            Back to dashboard
                        </p>
                    </Link>
                </Button>

                <Button className="btn-primary flex-1">
                    <Link
                        href={`/interview/${id}`}
                        className="flex w-full justify-center"
                    >
                        <p className="text-sm font-semibold text-black text-center">
                            Retake Interview
                        </p>
                    </Link>
                </Button>
            </div>
        </section>
    )
}
export default Page