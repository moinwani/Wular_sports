import { GetStaticProps } from 'next';
import { BlogView } from '../../src/views/BlogView';
import { blogs } from '../../src/data/blogs';
import { BlogPost } from '../../src/types';

interface Props { blogs: BlogPost[]; }

export default function BlogPage({ blogs }: Props) {
    return <BlogView blogs={blogs} />;
}

export const getStaticProps: GetStaticProps<Props> = async () => {
    return { props: { blogs } };
};
