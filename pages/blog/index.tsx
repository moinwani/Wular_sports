import { GetStaticProps } from 'next';
import { BlogView } from '../../src/views/BlogView';
import { blogs } from '../../src/data/blogs';
import { BlogPost } from '../../src/types';

interface Props { blogs: BlogPost[]; }

export default function BlogPage({ blogs }: Props) {
    return <BlogView blogs={blogs} />;
}

export const getStaticProps: GetStaticProps<Props> = async () => {
    // Cards only need these fields; full articles would bloat the page by ~200 KB
    const cards = blogs.map(({ id, title, description, author, date, image, category, readTime }) => ({
        id, title, description, author, date, image, category, readTime, content: '',
    }));
    return { props: { blogs: cards } };
};
