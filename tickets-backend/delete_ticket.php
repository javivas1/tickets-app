<?php
header("Content-Type: application/json; charset=UTF-8");
require "db.php";

if($_SERVER['REQUEST_METHOD']!=='DELETE' && $_SERVER['REQUEST_METHOD']!=='POST'){
  http_response_code(405); echo json_encode(["error"=>"Método no permitido"]); exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$id = (int)($data["id"] ?? 0);
if($id<=0){ echo json_encode(["error"=>"ID inválido"]); exit; }

$stmt = $conn->prepare("DELETE FROM tickets WHERE id=?");
$stmt->bind_param("i",$id);
$ok = $stmt->execute();
echo $ok ? json_encode(["success"=>true]) : json_encode(["error"=>"No se pudo eliminar"]);

$stmt->close();
$conn->close();
