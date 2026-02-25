interface DocumentListProps {
    items: string[];
}

export default function DocumentList({ items }: DocumentListProps) {
    return (
        <ul className="clean-list">
            {items.map((doc) => (
                <li key={doc}>{doc}</li>
            ))}
        </ul>
    );
}