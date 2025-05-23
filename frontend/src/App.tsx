import { AuthForm } from "./components/AuthForm";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Toaster position="top-right" />
            <AuthForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="https://th.bing.com/th/id/R.32a7558daf8e45f15ab06aab6903fe0b?rik=%2f0tJ4acSlgpTqg&riu=http%3a%2f%2fgetwallpapers.com%2fwallpaper%2ffull%2f0%2fb%2f7%2f465056.jpg&ehk=fNvBOZSC2O65rWj9K78aiUgZPylvqNujAKKJN1vVyYg%3d&risl=&pid=ImgRaw&r=0"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}

export default App;
