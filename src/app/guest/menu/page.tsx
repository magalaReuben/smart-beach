import MenuOrder from "./menu-order";

export default async function MenuPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          SMART BEACH
        </p>
        <h1 className="text-3xl font-bold">MENU</h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          Browse menu categories and select items to build your order. Choose a category or view all menu items.
        </p>
      </div>
      <MenuOrder />
    </div>
  );
}
