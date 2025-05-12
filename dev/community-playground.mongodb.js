use('test');

db.getCollection('communities').insertOne({
  name: "First Test Community",
  description: "Created manually via playground.",
  owner: ObjectId("681d23aa0e1af215726ffc5d"),
  members: [ObjectId("681d23aa0e1af215726ffc5d")],
  createdAt: new Date()
});