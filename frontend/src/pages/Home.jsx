import NavBar from "../components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-neutral-900">
      <NavBar />
      <div className="py-12 px-24">
        <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-black dark:text-white">
          Track all clients, projects, <br></br>teams, and tasks.
        </h1>
        <p className="mt-2 md:mt-4 lg:mt-6 text-sm md:text-lg lg:text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl font-normal">
          The streamlined workspace for engineering teams to manage
          high-performance workflows and deliver complex systems{" "}
          <em>on time</em>.
        </p>
      </div>
    </div>
  );
}
