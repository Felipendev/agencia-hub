import { redirect } from "next/navigation";

/** A lixeira foi descontinuada — exclusões de cliente são permanentes. */
export default function LixeiraPage() {
  redirect("/dashboard");
}
