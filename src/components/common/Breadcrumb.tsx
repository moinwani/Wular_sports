import Link from 'next/link';
import { FC } from 'react';
import { Icon } from './Icon';

interface Crumbs {
    name: string;
    url?: string;
}

interface BreadcrumbProps {
    items: Crumbs[];
}

export const Breadcrumb: FC<BreadcrumbProps> = ({ items }) => (
    <nav className="breadcrumb" aria-label="Breadcrumb">
        <ol>
            {items.map((item, i) => (
                <li key={i}>
                    {i > 0 && (
                        <Icon
                            name="fa-chevron-right"
                            style={{ margin: '0 0.5rem', fontSize: '0.7rem', color: '#666' }}
                        />
                    )}
                    {item.url ? (
                        <Link href={item.url}>{item.name}</Link>
                    ) : (
                        <span aria-current="page">{item.name}</span>
                    )}
                </li>
            ))}
        </ol>
    </nav>
);
