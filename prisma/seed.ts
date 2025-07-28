import { Day, PrismaClient, UserSex, AttendanceStatus } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // ✅ Clear all tables in correct dependency order
  await prisma.result.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.event.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.admin.deleteMany();

  console.log("🗑️ Cleared all tables...");

  // ✅ ADMIN
  await prisma.admin.createMany({
    data: [
      { id: "admin1", username: "admin1" },
      { id: "admin2", username: "admin2" },
    ],
  });

  // ✅ GRADE
  const grades = await prisma.$transaction(
    Array.from({ length: 6 }, (_, i) =>
      prisma.grade.create({ data: { level: i + 1 } })
    )
  );

  // ✅ CLASS
  const classes = await prisma.$transaction(
    grades.map((grade, i) =>
      prisma.class.create({
        data: {
          name: `${i + 1}A`,
          gradeId: grade.id,
          capacity: Math.floor(Math.random() * (20 - 15 + 1)) + 15,
        },
      })
    )
  );

  // ✅ SUBJECT
  const subjectNames = [
    "Mathematics",
    "Science",
    "English",
    "History",
    "Geography",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Art",
  ];

  const subjects = await prisma.$transaction(
    subjectNames.map((name) => prisma.subject.create({ data: { name } }))
  );

  // ✅ TEACHER
  const teachers = await prisma.$transaction(
    Array.from({ length: 15 }, (_, i) =>
      prisma.teacher.create({
        data: {
          id: `teacher${i + 1}`,
          username: `teacher${i + 1}`,
          name: `TName${i + 1}`,
          surname: `TSurname${i + 1}`,
          email: `teacher${i + 1}@example.com`,
          phone: `123-456-789${i + 1}`,
          address: `Address${i + 1}`,
          bloodType: "A+",
          sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
          subjects: { connect: [{ id: subjects[i % subjects.length].id }] },
          classes: { connect: [{ id: classes[i % classes.length].id }] },
          birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 30)),
        },
      })
    )
  );

  // ✅ LESSON
  const lessons = await prisma.$transaction(
    Array.from({ length: 30 }, (_, i) =>
      prisma.lesson.create({
        data: {
          name: `Lesson${i + 1}`,
          day: Day[Object.keys(Day)[Math.floor(Math.random() * Object.keys(Day).length)] as keyof typeof Day],
          startTime: new Date(new Date().setHours(9)),
          endTime: new Date(new Date().setHours(11)),
          subjectId: subjects[i % subjects.length].id,
          classId: classes[i % classes.length].id,
          teacherId: `teacher${(i % teachers.length) + 1}`,
        },
      })
    )
  );

  // ✅ PARENT
  const parents = await prisma.$transaction(
    Array.from({ length: 25 }, (_, i) =>
      prisma.parent.create({
        data: {
          id: `parentId${i + 1}`,
          username: `parentId${i + 1}`,
          name: `PName${i + 1}`,
          surname: `PSurname${i + 1}`,
          email: `parent${i + 1}@example.com`,
          phone: `123-456-789${i + 1}`,
          address: `Address${i + 1}`,
        },
      })
    )
  );

  // ✅ STUDENT
  const students = await prisma.$transaction(
    Array.from({ length: 50 }, (_, i) =>
      prisma.student.create({
        data: {
          id: `student${i + 1}`,
          username: `student${i + 1}`,
          name: `SName${i + 1}`,
          surname: `SSurname${i + 1}`,
          email: `student${i + 1}@example.com`,
          phone: `987-654-321${i + 1}`,
          address: `Address${i + 1}`,
          bloodType: "O-",
          sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
          parentId: parents[i % parents.length].id,
          gradeId: grades[i % grades.length].id,
          classId: classes[i % classes.length].id,
          birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 10)),
        },
      })
    )
  );

  // ✅ EXAMS
  const exams = await prisma.$transaction(
    Array.from({ length: 5 }, (_, i) =>
      prisma.exam.create({
        data: {
          title: `Exam ${i + 1}`,
          startTime: new Date(new Date().setHours(10)),
          endTime: new Date(new Date().setHours(12)),
          lessonId: lessons[i % lessons.length].id,
        },
      })
    )
  );

  // ✅ ASSIGNMENTS
  const assignments = await prisma.$transaction(
    Array.from({ length: 5 }, (_, i) =>
      prisma.assignment.create({
        data: {
          title: `Assignment ${i + 1}`,
          startDate: new Date(),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
          lessonId: lessons[i % lessons.length].id,
        },
      })
    )
  );

  // ✅ RESULTS
  await prisma.$transaction(
    Array.from({ length: 10 }, (_, i) =>
      prisma.result.create({
        data: {
          score: 80 + i,
          studentId: students[i].id,
          ...(i < 5 ? { examId: exams[i].id } : { assignmentId: assignments[i - 5].id }),
        },
      })
    )
  );

  // ✅ ATTENDANCE
  await prisma.$transaction(
    Array.from({ length: 10 }, (_, i) =>
      prisma.attendance.create({
        data: {
          date: new Date(),
          studentId: students[i].id,
          lessonId: lessons[i % lessons.length].id,
          status: AttendanceStatus.present,
        },
      })
    )
  );

  // ✅ EVENTS
  await prisma.$transaction(
    Array.from({ length: 5 }, (_, i) =>
      prisma.event.create({
        data: {
          title: `Event ${i + 1}`,
          description: `Description for Event ${i + 1}`,
          startTime: new Date(),
          endTime: new Date(new Date().setHours(new Date().getHours() + 2)),
          classId: classes[i % classes.length].id,
        },
      })
    )
  );

  // ✅ ANNOUNCEMENTS
  await prisma.$transaction(
    Array.from({ length: 5 }, (_, i) =>
      prisma.announcement.create({
        data: {
          title: `Announcement ${i + 1}`,
          description: `Description for Announcement ${i + 1}`,
          date: new Date(),
          classId: classes[i % classes.length].id,
        },
      })
    )
  );

  console.log("✅ Seeding completed successfully.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
