"use client";

import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { supportEmail, supportPhoneDisplay } from "@/src/lib/company";

type AccountDeleteActionsProps = {
  initialEmail: string | null;
  isSignedIn: boolean;
};

export function AccountDeleteActions({ initialEmail, isSignedIn }: AccountDeleteActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to delete account. Please try again or contact support.");
        setIsDeleting(false);
        return;
      }

      setIsDeleted(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 3000);
    } catch {
      setErrorMessage("A network error occurred. Please check your connection and try again.");
      setIsDeleting(false);
    }
  }

  if (isDeleted) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-6 text-center dark:bg-emerald-950/20">
        <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">Account Deleted Successfully</h3>
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
          Your Looplic account and personal data have been permanently removed. Redirecting to home...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isSignedIn ? (
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">
            Signed in as: <strong className="text-foreground">{initialEmail || "Verified User"}</strong>
          </p>

          {errorMessage ? (
            <p className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs font-medium text-destructive">
              {errorMessage}
            </p>
          ) : null}

          {!showConfirm ? (
            <div className="mt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowConfirm(true)}
                className="rounded-xl font-semibold shadow-sm"
              >
                <Trash2 className="mr-2 size-4" />
                Delete My Account
              </Button>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-semibold text-destructive">
                Are you sure you want to permanently delete your account?
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This will delete your login credentials, saved addresses, and profile data immediately. This action cannot be undone.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-xl"
                >
                  {isDeleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {isDeleting ? "Deleting..." : "Yes, Permanently Delete"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={isDeleting}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            To delete your account immediately via 1-click confirmation, please sign in:
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-xl font-semibold">
              <Link href="/auth?redirect=/account/delete">Sign In to Delete Account</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl font-semibold">
              <a
                href={`mailto:${supportEmail}?subject=Account%20and%20Data%20Deletion%20Request&body=Hello%20Looplic%20Support%2C%0A%0APlease%20permanently%20delete%20my%20Looplic%20account%20and%20associated%20data.%0A%0ARegistered%20Email%20or%20Phone%3A%20`}
              >
                Request Deletion via Email
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Support contact: <strong>{supportEmail}</strong> | <strong>{supportPhoneDisplay}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

