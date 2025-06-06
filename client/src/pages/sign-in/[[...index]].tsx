import { SignIn } from "@clerk/nextjs";
import Layout from "../../components/Layout";

export default function SignInPage() {
  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[70vh]">
        <SignIn />
      </div>
    </Layout>
  );
}