import InvitationAcceptForm from "./InvitationAcceptForm"

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitationPage({ params }: Props) {
  const { token } = await params
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

  let invitation: {
    fullName: string
    email: string
    role: string
    orgName: string
  } | null = null

  let error: string | null = null

  try {
    const res = await fetch(`${baseUrl}/api/invitations/accept?token=${token}`, {
      cache: "no-store",
    })
    const json = await res.json()
    if (!res.ok) {
      error = json.error ?? "Invalid invitation"
    } else {
      invitation = json.data
    }
  } catch {
    error = "Unable to validate invitation"
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <span className="text-2xl">✗</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Invitation not valid</h1>
          <p className="text-sm text-gray-500">{error}</p>
          <p className="text-sm text-gray-400">
            Ask your admin to resend the invitation link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Join {invitation!.orgName}</h1>
          <p className="text-sm text-gray-500">
            You&apos;ve been invited as{" "}
            <span className="font-medium text-gray-800">{invitation!.fullName}</span> with role{" "}
            <span className="font-medium text-gray-800">{invitation!.role.replace(/_/g, " ")}</span>.
          </p>
          <p className="text-xs text-gray-400">{invitation!.email}</p>
        </div>

        <InvitationAcceptForm token={token} />
      </div>
    </div>
  )
}
