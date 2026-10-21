import ProductCard from '../../components/data/ProductCard';
import { products } from '../../data/mockData';
import { productCopy } from '../../data/landingData';

export default function FeaturedProducts() {
  return (
    <section id="productos" aria-labelledby="products-title" className="bg-gray-100 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="products-title" className="text-3xl font-semibold">Nuestros productos</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => <li key={p.id}><ProductCard name={p.name} image={p.image} description={productCopy[p.id]} /></li>)}
        </ul>
      </div>
    </section>
  );
}
