import React from "react";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Prisma, Student, Attendance } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import AttendanceMarking from "@/components/AttendanceMarking";
import FilterBar from "@/components/FilterBar";

type StudentWithClass = Student & {
  class: Class;
};

type AttendanceWithStudent = Attendance & {
  student: StudentWithClass;
};

const AttendancePage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  try {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // Parse date safely to yyyy-MM-dd format
    const selectedDateRaw = searchParams.date;
    let selectedDate: string;
    if (selectedDateRaw) {
      const d = new Date(selectedDateRaw);
      selectedDate = !isNaN(d.getTime())
        ? d.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
    } else {
      selectedDate = new Date().toISOString().split("T")[0];
    }

    const selectedClassId = searchParams.classId;

    // Force student role to use report view
    const viewModeFromParams = searchParams.view || "mark";
    const viewMode = role === "student" ? "reports" : viewModeFromParams;

    const columns = [
      {
        header: "Student Name",
        accessor: "student",
      },
      {
        header: "Roll No",
        accessor: "rollNo",
        className: "hidden md:table-cell",
      },
      {
        header: "Class",
        accessor: "class",
        className: "hidden md:table-cell",
      },
      {
        header: "Date",
        accessor: "date",
        className: "hidden lg:table-cell",
      },
      {
        header: "Status",
        accessor: "status",
      },
      ...(role === "admin" || role === "teacher"
        ? [
            {
              header: "Actions",
              accessor: "action",
            },
          ]
        : []),
    ];

    const renderRow = (item: AttendanceWithStudent) => (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">
              {item.student.name} {item.student.surname}
            </h3>
            <p className="text-xs text-gray-500">{item.student.email}</p>
          </div>
        </td>
        <td className="hidden md:table-cell">{item.student.username}</td>
        <td className="hidden md:table-cell">{item.student.class.name}</td>
        <td className="hidden lg:table-cell">
          {new Date(item.date).toLocaleDateString()}
        </td>
        <td>
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              item.status === "present"
                ? "bg-green-100 text-green-800"
                : item.status === "late"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        </td>
        {(role === "admin" || role === "teacher") && (
          <td>
            <div className="flex items-center gap-2">
              <FormContainer table="attendance" type="update" data={item} />
              <FormContainer table="attendance" type="delete" id={item.id} />
            </div>
          </td>
        )}
      </tr>
    );

    const { page, ...queryParams } = searchParams;
    const p = page ? parseInt(page) : 1;

    // Build query conditions
    const query: Prisma.AttendanceWhereInput = {};

    // Add date filter
    if (selectedDate) {
      query.date = {
        gte: new Date(selectedDate + "T00:00:00.000Z"),
        lt: new Date(selectedDate + "T23:59:59.999Z"),
      };
    }

    // Add other filters
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined) {
          switch (key) {
            case "classId":
              query.student = {
                classId: parseInt(value),
              };
              break;
            case "search":
              query.student = {
                OR: [
                  { name: { contains: value, mode: "insensitive" } },
                  { surname: { contains: value, mode: "insensitive" } },
                  { username: { contains: value, mode: "insensitive" } },
                ],
              };
              break;
            case "status":
              query.status = value as any; // Match enum
              break;
            default:
              break;
          }
        }
      }
    }

    // Data holders
    let data: AttendanceWithStudent[] = [];
    let count = 0;
    let classes: Class[] = [];
    let students: StudentWithClass[] = [];

    if (viewMode === "reports") {
      [data, count] = await prisma.$transaction([
        prisma.attendance.findMany({
          where: query,
          include: {
            student: {
              include: {
                class: true,
              },
            },
          },
          take: ITEM_PER_PAGE,
          skip: ITEM_PER_PAGE * (p - 1),
          orderBy: {
            date: "desc",
          },
        }),
        prisma.attendance.count({ where: query }),
      ]);
    } else {
      const studentQuery: Prisma.StudentWhereInput = {};

      if (selectedClassId) {
        studentQuery.classId = parseInt(selectedClassId);
      }

      if (queryParams.search) {
        studentQuery.OR = [
          { name: { contains: queryParams.search, mode: "insensitive" } },
          { surname: { contains: queryParams.search, mode: "insensitive" } },
          { username: { contains: queryParams.search, mode: "insensitive" } },
        ];
      }

      students = await prisma.student.findMany({
        where: studentQuery,
        include: {
          class: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
        orderBy: {
          name: "asc",
        },
      });

      count = await prisma.student.count({ where: studentQuery });
    }

    classes = await prisma.class.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        {/* TOP */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="hidden md:block text-lg font-semibold">
            {viewMode === "mark" ? "Mark Attendance" : "Attendance Reports"}
          </h1>

          <FilterBar
            selectedDate={selectedDate}
            selectedClassId={selectedClassId}
            queryParams={queryParams}
            viewMode={viewMode}
            classes={classes}
          />
        </div>

        {/* CONTENT */}
        {viewMode === "mark" && (role === "admin" || role === "teacher") ? (
          <AttendanceMarking
            students={students}
            selectedDate={selectedDate}
            selectedClassId={selectedClassId}
          />
        ) : (
          <>
            <Table columns={columns} renderRow={renderRow} data={data} />
            <Pagination page={p} count={count} />
          </>
        )}
      </div>
    );
  } catch (err) {
    console.error("Error rendering AttendancePage:", err);
    return (
      <div className="p-4 text-red-600">Failed to load attendance page.</div>
    );
  }
};

export default AttendancePage;
