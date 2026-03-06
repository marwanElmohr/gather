import NavBar from "../components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-neutral-900">
      <NavBar />
      <div className="py-8 px-24">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Welcome to MyPM!
        </h1>
      </div>
    </div>
  );
}
