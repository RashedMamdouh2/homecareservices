using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Homecare.Migrations
{
    /// <inheritdoc />
    public partial class secondmig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointements_Reports_ReportId",
                table: "Appointements");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Medication",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Dose",
                table: "Medication",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DoseFrequency",
                table: "Medication",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Medication",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ReportId",
                table: "Medication",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UsageTimes",
                table: "Medication",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "ReportId",
                table: "Appointements",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "MeetingAddress",
                table: "Appointements",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PhysicianNotes",
                table: "Appointements",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Appointements",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Medication_ReportId",
                table: "Medication",
                column: "ReportId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointements_Reports_ReportId",
                table: "Appointements",
                column: "ReportId",
                principalTable: "Reports",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Medication_Reports_ReportId",
                table: "Medication",
                column: "ReportId",
                principalTable: "Reports",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointements_Reports_ReportId",
                table: "Appointements");

            migrationBuilder.DropForeignKey(
                name: "FK_Medication_Reports_ReportId",
                table: "Medication");

            migrationBuilder.DropIndex(
                name: "IX_Medication_ReportId",
                table: "Medication");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Medication");

            migrationBuilder.DropColumn(
                name: "Dose",
                table: "Medication");

            migrationBuilder.DropColumn(
                name: "DoseFrequency",
                table: "Medication");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Medication");

            migrationBuilder.DropColumn(
                name: "ReportId",
                table: "Medication");

            migrationBuilder.DropColumn(
                name: "UsageTimes",
                table: "Medication");

            migrationBuilder.DropColumn(
                name: "MeetingAddress",
                table: "Appointements");

            migrationBuilder.DropColumn(
                name: "PhysicianNotes",
                table: "Appointements");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Appointements");

            migrationBuilder.AlterColumn<int>(
                name: "ReportId",
                table: "Appointements",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Appointements_Reports_ReportId",
                table: "Appointements",
                column: "ReportId",
                principalTable: "Reports",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
