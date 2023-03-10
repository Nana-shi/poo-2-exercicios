import express, { Request, Response } from 'express';
import cors from "cors"
import { Video } from './models/Video'
import { VideoDatabase } from './database/VideoDatabase';
import { TVideosDB } from './types';

const app = express()

app.use(cors())
app.use(express.json())

app.listen(3003, () => {
    console.log(`Servidor rodando na porta ${3003}`)
})

app.get("/ping", (req: Request, res: Response) => {
    try {
        res.status(200).send({ message: "Pong" })
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})
// Get All Videos - OK
app.get("/videos", async (req: Request, res: Response) => {
    try {
        const q = req.query.q as string | undefined
        const videoDatabase = new VideoDatabase()
        const videosDB = await videoDatabase.findVideos(q)
        const videos: Video[] = videosDB.map((videoDB) =>
            new Video(
                videoDB.id,
                videoDB.title,
                videoDB.duration,
                videoDB.upload_date
            ))
        res.status(200).send(videos)
    } catch (error) {
        console.log(error)
        if (req.statusCode === 200) {
            res.status(500)
        }
        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})
// Create New Video - OK
app.post("/videos", async (req: Request, res: Response) => {
    try {
        const { id, title, duration } = req.body
        if (typeof id !== "string") {
            res.status(400)
            throw new Error("'id' deve ser string")
        }
        if (typeof title !== "string") {
            res.status(400)
            throw new Error("'title' deve ser string")
        }
        if (typeof duration !== "number") {
            res.status(400)
            throw new Error("'duration' deve ser number")
        }
        const videoDatabase = new VideoDatabase()
        const videoDBExist = await videoDatabase.findVideoById(id)
        if (videoDBExist) {
            res.status(400)
            throw new Error("'id' j?? existe")
        }
        const newVideo = new Video(
            id,
            title,
            duration,
            new Date().toLocaleString()
        )
        const newVideoDB: TVideosDB = {
            id: newVideo.getId(),
            title: newVideo.getTitle(),
            duration: newVideo.getDuration(),
            upload_date: newVideo.getUploadDate()
        }
        await videoDatabase.insertVideo(newVideoDB)
        res.status(201).send(newVideo)
    } catch (error) {
        console.log(error)
        if (req.statusCode === 200) {
            res.status(500)
        }
        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})
// Edit Video By ID - OK
app.put("/videos/:id", async (req: Request, res: Response) => {
    try {
        const id = req.params.id
        const newId = req.body.id
        const newTitle = req.body.title
        const newDuration = req.body.duration
        if (!newId && !newTitle && !newDuration) {
            res.status(400)
            throw new Error("'id', 'title', 'duration' precisam estar corretos!")
        }
        if (newId !== undefined) {
            if (typeof newId !== "string") {
                res.status(400)
                throw new Error("'id' precisa ser string")
            }
        }
        if (newTitle !== undefined) {
            if (typeof newTitle !== "string") {
                res.status(400)
                throw new Error("'title' precisa ser string")
            }
        }
        if (newDuration !== undefined) {
            if (typeof newTitle !== "number") {
                res.status(400)
                throw new Error("'duration' precisa ser number")
            }
        }
        const videoDatabase = new VideoDatabase()
        const videoDBExist = await videoDatabase.findVideoById(id)
        if (!videoDBExist) {
            res.status(404)
            throw new Error("'id' n??o encontrado")
        }
        const videoToEdit = new Video(
            newId,
            newTitle,
            newDuration,
            new Date().toLocaleString()
        )
        const updateVideoDB: TVideosDB = {
            id: videoToEdit.getId() || videoDBExist.id,
            title: videoToEdit.getTitle() || videoDBExist.title,
            duration: videoToEdit.getDuration() || videoDBExist.duration,
            upload_date: videoToEdit.getUploadDate() || videoDBExist.upload_date
        }
        await videoDatabase.editVideoById(id, updateVideoDB)
        res.status(200).send("Video atualizado com sucesso!")
    } catch (error) {
        console.log(error)
        if (req.statusCode === 200) {
            res.status(500)
        }
        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.delete("/videos/:id", async (req: Request, res: Response)=>{
    try {
        const idToDelete = req.params.id
        const videoDatabase = new VideoDatabase()
        const videoToDelete = await videoDatabase.findVideoById(idToDelete)
        if(!videoToDelete){
            res.status(404)
            throw new Error("Video n??o encontrado!")
        } else{
            await videoDatabase.deleteVideoById(idToDelete)
            res.status(200).send("Video deletado com sucesso!")
        }
    } catch (error) {
        console.log(error)
        if (req.statusCode === 200) {
            res.status(500)
        }
        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})