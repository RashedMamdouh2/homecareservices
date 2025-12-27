using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Homecare.Migrations
{
    /// <inheritdoc />
    public partial class makediagnosisdatenullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PatientDisease_Diseases_ICD",
                table: "PatientDisease");

            migrationBuilder.DropForeignKey(
                name: "FK_PatientDisease_Patients_PatientId",
                table: "PatientDisease");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PatientDisease",
                table: "PatientDisease");

            migrationBuilder.RenameTable(
                name: "PatientDisease",
                newName: "PatientDiseases");

            migrationBuilder.RenameIndex(
                name: "IX_PatientDisease_PatientId",
                table: "PatientDiseases",
                newName: "IX_PatientDiseases_PatientId");

            migrationBuilder.RenameIndex(
                name: "IX_PatientDisease_ICD",
                table: "PatientDiseases",
                newName: "IX_PatientDiseases_ICD");

            migrationBuilder.AlterColumn<DateOnly>(
                name: "RecoverdDate",
                table: "PatientDiseases",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PatientDiseases",
                table: "PatientDiseases",
                column: "ID");

            migrationBuilder.AddForeignKey(
                name: "FK_PatientDiseases_Diseases_ICD",
                table: "PatientDiseases",
                column: "ICD",
                principalTable: "Diseases",
                principalColumn: "ICD",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PatientDiseases_Patients_PatientId",
                table: "PatientDiseases",
                column: "PatientId",
                principalTable: "Patients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PatientDiseases_Diseases_ICD",
                table: "PatientDiseases");

            migrationBuilder.DropForeignKey(
                name: "FK_PatientDiseases_Patients_PatientId",
                table: "PatientDiseases");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PatientDiseases",
                table: "PatientDiseases");

            migrationBuilder.RenameTable(
                name: "PatientDiseases",
                newName: "PatientDisease");

            migrationBuilder.RenameIndex(
                name: "IX_PatientDiseases_PatientId",
                table: "PatientDisease",
                newName: "IX_PatientDisease_PatientId");

            migrationBuilder.RenameIndex(
                name: "IX_PatientDiseases_ICD",
                table: "PatientDisease",
                newName: "IX_PatientDisease_ICD");

            migrationBuilder.AlterColumn<DateOnly>(
                name: "RecoverdDate",
                table: "PatientDisease",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1),
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_PatientDisease",
                table: "PatientDisease",
                column: "ID");

            migrationBuilder.AddForeignKey(
                name: "FK_PatientDisease_Diseases_ICD",
                table: "PatientDisease",
                column: "ICD",
                principalTable: "Diseases",
                principalColumn: "ICD",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PatientDisease_Patients_PatientId",
                table: "PatientDisease",
                column: "PatientId",
                principalTable: "Patients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
