import { SignUp } from "@clerk/nextjs";
import Layout from "../../components/Layout";

export default function SignUpPage() {
  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[70vh]">
        <SignUp />
      </div>
    </Layout>
  );
}