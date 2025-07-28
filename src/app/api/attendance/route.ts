import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { Attendance, Student } from '@prisma/client';

// Match Prisma enum values
enum AttendanceStatus {
  present = 'present',
  absent = 'absent',
  late = 'late',
}

// ================== GET Attendance Records ==================
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const dateStr = url.searchParams.get('date');
  const classIdStr = url.searchParams.get('classId');

  if (!dateStr) {
    return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
  }

  const dateStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dateEnd = new Date(`${dateStr}T23:59:59.999Z`);

  try {
    const where: any = { date: { gte: dateStart, lte: dateEnd } };

    if (classIdStr) {
      const classId = parseInt(classIdStr);
      if (!isNaN(classId)) {
        where.student = { classId };
      }
    }

    // ✅ Explicitly typed query
    const attendanceRecords: (Attendance & { student: Student })[] =
      await prisma.attendance.findMany({
        where,
        include: { student: true },
      });

    // Format for UI
    const responseData = attendanceRecords.map((record) => ({
      id: record.id,
      studentId: record.studentId,
      lessonId: record.lessonId,
      date: record.date.toISOString(),
      status: record.status,
      student: record.student,
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('GET attendance error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

// ================== POST: Mark or Update Attendance ==================
export async function POST(request: NextRequest) {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!role || !['admin', 'teacher'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const data = await request.json();

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid payload, expected array' }, { status: 400 });
    }

    // Validate payload
    for (const record of data) {
      if (!record.studentId || !record.date || !record.status || typeof record.lessonId !== 'number') {
        return NextResponse.json(
          { error: 'Missing required fields in attendance record' },
          { status: 400 }
        );
      }
      if (!Object.values(AttendanceStatus).includes(record.status)) {
        return NextResponse.json(
          { error: `Invalid status: ${record.status}` },
          { status: 400 }
        );
      }
    }

    // ✅ Save or update attendance using composite key (studentId + lessonId + date)
    const saved: Attendance[] = await Promise.all(
      data.map(async (record) =>
        prisma.attendance.upsert({
          where: {
            studentId_lessonId_date: {
              studentId: record.studentId,
              lessonId: record.lessonId,
              date: new Date(record.date),
            },
          },
          update: { status: record.status },
          create: {
            studentId: record.studentId,
            lessonId: record.lessonId,
            date: new Date(record.date),
            status: record.status,
          },
        })
      )
    );

    return NextResponse.json({ message: 'Attendance saved successfully', saved });
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
