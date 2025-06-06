"use client"

import { useEffect, useState } from "react"
import {
    Reasoning,
    ReasoningContent,
    ReasoningResponse,
    ReasoningTrigger,
} from "../ui/reasoning"

export function ReasoningBasic() {
    const reasoningText = `I calculated the best color balance for the image. The image is a photo of a car, and the color balance is the best color balance for the image. The color balance is the best color balance for the image.
  1. First, we consider the color of the car
  2. Then, we consider the color of the sky
  3. Finally, we consider the color of the grass
  4. We then calculate the best color balance for the image
  5. We then apply the best color balance to the image
  6. We then save the image
  `
    const [test, setTest] = useState<string>("")

    // useEffect(() => {
    //     let i = 0;
    //     const interval = setInterval(() => {
    //         if (i < reasoningText.length) {
    //             setTest(prev => prev + reasoningText.charAt(i));
    //             i++;
    //         } else {
    //             clearInterval(interval);
    //         }
    //     }, 500);

    //     return () => clearInterval(interval);
    // }, [reasoningText]);

    return (
        <Reasoning>
            <div className="flex w-full flex-col gap-3">
                <p className="text-base">I calculated the best color balance</p>
                <ReasoningTrigger>Show reasoning</ReasoningTrigger>
                <ReasoningContent className="ml-2 border-l-2 border-l-slate-200 px-2 pb-1 dark:border-l-slate-700">
                    <ReasoningResponse text={test} />
                </ReasoningContent>
            </div>
        </Reasoning>
    )
}

export default ReasoningBasic;