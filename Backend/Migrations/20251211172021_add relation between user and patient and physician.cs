using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Homecare.Migrations
{
    /// <inheritdoc />
    public partial class addrelationbetweenuserandpatientandphysician : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Patients_PatientId",
                table: "Reports");

            migrationBuilder.RenameColumn(
                name: "PatientId",
                table: "Reports",
                newName: "patientId");

            migrationBuilder.RenameIndex(
                name: "IX_Reports_PatientId",
                table: "Reports",
                newName: "IX_Reports_patientId");

            migrationBuilder.AddColumn<int>(
                name: "PatientId",
                table: "AspNetUsers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PhysicianId",
                table: "AspNetUsers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_PatientId",
                table: "AspNetUsers",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_PhysicianId",
                table: "AspNetUsers",
                column: "PhysicianId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Patients_PatientId",
                table: "AspNetUsers",
                column: "PatientId",
                principalTable: "Patients",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Physicians_PhysicianId",
                table: "AspNetUsers",
                column: "PhysicianId",
                principalTable: "Physicians",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Patients_patientId",
                table: "Reports",
                column: "patientId",
                principalTable: "Patients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Patients_PatientId",
                table: "AspNetUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Physicians_PhysicianId",
                table: "AspNetUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Patients_patientId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_PatientId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_PhysicianId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "PatientId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "PhysicianId",
                table: "AspNetUsers");

            migrationBuilder.RenameColumn(
                name: "patientId",
                table: "Reports",
                newName: "PatientId");

            migrationBuilder.RenameIndex(
                name: "IX_Reports_patientId",
                table: "Reports",
                newName: "IX_Reports_PatientId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Patients_PatientId",
                table: "Reports",
                column: "PatientId",
                principalTable: "Patients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
