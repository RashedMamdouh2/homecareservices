using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Homecare.Migrations
{
    /// <inheritdoc />
    public partial class reporttoappointmentrelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointements_Reports_ReportId",
                table: "Appointements");

            migrationBuilder.DropIndex(
                name: "IX_Appointements_ReportId",
                table: "Appointements");

            migrationBuilder.AddColumn<Guid>(
                name: "AppointmentId",
                table: "Reports",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Reports_AppointmentId",
                table: "Reports",
                column: "AppointmentId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Appointements_AppointmentId",
                table: "Reports",
                column: "AppointmentId",
                principalTable: "Appointements",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Appointements_AppointmentId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_AppointmentId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "AppointmentId",
                table: "Reports");

            migrationBuilder.CreateIndex(
                name: "IX_Appointements_ReportId",
                table: "Appointements",
                column: "ReportId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointements_Reports_ReportId",
                table: "Appointements",
                column: "ReportId",
                principalTable: "Reports",
                principalColumn: "Id");
        }
    }
}
