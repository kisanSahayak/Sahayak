interface StepBoxProps {
    num: string;
    title: string;
    desc: string;
}

export default function StepBox({ num, title, desc }: StepBoxProps) {
    return (
        <div className="step-box">
            <div className="step-num">{num}</div>
            <div className="step-title">{title}</div>
            <div className="step-desc">{desc}</div>
        </div>
    );
}