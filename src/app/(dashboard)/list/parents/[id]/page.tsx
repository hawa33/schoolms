import FormContainer from "@/components/FormContainer";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Link from "next/link";

const SingleParentPage = async ({ params: { id } }: { params: { id: string } }) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const parent = await prisma.parent.findUnique({
    where: { id },
    include: {
      students: {
        include: { class: true },
      },
    },
    // Ensure 'img' is selected
  });

  if (!parent) return notFound();

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="bg-lamaSky py-6 px-4 rounded-md flex gap-4">
          <div className="w-1/3">
            <Image
              src={"/noAvatar.png"}
              alt="Parent photo"
              width={144}
              height={144}
              className="w-36 h-36 rounded-full object-cover"
            />
          </div>
          <div className="w-2/3 flex flex-col justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">
                {parent.name + " " + parent.surname}
              </h1>
              {role === "admin" && (
                <FormContainer table="parent" type="update" data={parent} />
              )}
            </div>
            <p className="text-sm text-gray-500">
              Contact and information summary.
            </p>
            <div className="flex flex-wrap text-xs font-medium gap-2">
              <div className="flex items-center gap-2">
                <Image src="/mail.png" alt="" width={14} height={14} />
                <span>{parent.email || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Image src="/phone.png" alt="" width={14} height={14} />
                <span>{parent.phone || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* STUDENTS */}
        <div className="mt-4 bg-white rounded-md p-4">
          <h2 className="text-lg font-semibold mb-2">Children</h2>
          <ul className="list-disc pl-4 space-y-2">
            {parent.students.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/students/${s.id}`} className="text-blue-600 underline">
                  {s.name} {s.surname} ({s.class.name})
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* Add any shortcut or performance-style component here if needed */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            {parent.students.map((student) => (
              <Link
                key={student.id}
                href={`/list/results?studentId=${student.id}`}
                className="p-3 rounded-md bg-lamaSkyLight"
              >
                {student.name}&apos;s Results
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleParentPage;
