using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Homecare.Migrations
{
    /// <inheritdoc />
    public partial class createSubscriptionModelforpriceplans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SubscriptionId",
                table: "Patients",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateTable(
                name: "Subscriptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<int>(type: "int", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subscriptions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Patients_SubscriptionId",
                table: "Patients",
                column: "SubscriptionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Patients_Subscriptions_SubscriptionId",
                table: "Patients",
                column: "SubscriptionId",
                principalTable: "Subscriptions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetDefault);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Patients_Subscriptions_SubscriptionId",
                table: "Patients");

            migrationBuilder.DropTable(
                name: "Subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_Patients_SubscriptionId",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "SubscriptionId",
                table: "Patients");
        }
    }
}
